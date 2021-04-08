/*!
 * @license
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AppOptions, app } from '../firebase-namespace-api';
import { Credential, GoogleOAuthAccessToken } from './credential';
import { getApplicationDefault } from './credential-internal';
import * as validator from '../utils/validator';
import { deepCopy } from '../utils/deep-copy';
import { FirebaseNamespaceInternals } from './firebase-namespace';
import { AppErrorCodes, FirebaseAppError } from '../utils/error';

import { Auth } from '../auth/index';
import { MachineLearning } from '../machine-learning/index';
import { Messaging } from '../messaging/index';
import { Storage } from '../storage/index';
import { Database } from '../database/index';
import { Firestore } from '../firestore/index';
import { InstanceId } from '../instance-id/index';
import { ProjectManagement } from '../project-management/index';
import { SecurityRules } from '../security-rules/index';
import { RemoteConfig } from '../remote-config/index';

/**
 * Type representing a callback which is called every time an app lifecycle event occurs.
 */
export type AppHook = (event: string, app: app.App) => void;

/**
 * Type representing a Firebase OAuth access token (derived from a Google OAuth2 access token) which
 * can be used to authenticate to Firebase services such as the Realtime Database and Auth.
 */
export interface FirebaseAccessToken {
  accessToken: string;
  expirationTime: number;
}

/**
 * Internals of a FirebaseApp instance.
 */
export class FirebaseAppInternals {
  private isDeleted_ = false;
  private cachedToken_: FirebaseAccessToken;
  private cachedTokenPromise_: Promise<FirebaseAccessToken> | null;
  private tokenListeners_: Array<(token: string) => void>;
  private tokenRefreshTimeout_: NodeJS.Timer;

  constructor(private credential_: Credential) {
    this.tokenListeners_ = [];
  }

  /**
   * Gets an auth token for the associated app.
   *
   * @param {boolean} forceRefresh Whether or not to force a token refresh.
   * @return {Promise<FirebaseAccessToken>} A Promise that will be fulfilled with the current or
   *   new token.
   */
  public getToken(forceRefresh?: boolean): Promise<FirebaseAccessToken> {
    const expired = this.cachedToken_ && this.cachedToken_.expirationTime < Date.now();
    if (this.cachedTokenPromise_ && !forceRefresh && !expired) {
      return this.cachedTokenPromise_
        .catch((error) => {
          // Update the cached token promise to avoid caching errors. Set it to resolve with the
          // cached token if we have one (and return that promise since the token has still not
          // expired).
          if (this.cachedToken_) {
            this.cachedTokenPromise_ = Promise.resolve(this.cachedToken_);
            return this.cachedTokenPromise_;
          }

          // Otherwise, set the cached token promise to null so that it will force a refresh next
          // time getToken() is called.
          this.cachedTokenPromise_ = null;

          // And re-throw the caught error.
          throw error;
        });
    } else {
      // Clear the outstanding token refresh timeout. This is a noop if the timeout is undefined.
      clearTimeout(this.tokenRefreshTimeout_);

      // this.credential_ may be an external class; resolving it in a promise helps us
      // protect against exceptions and upgrades the result to a promise in all cases.
      this.cachedTokenPromise_ = Promise.resolve(this.credential_.getAccessToken())
        .then((result: GoogleOAuthAccessToken) => {
          // Since the developer can provide the credential implementation, we want to weakly verify
          // the return type until the type is properly exported.
          if (!validator.isNonNullObject(result) ||
            typeof result.expires_in !== 'number' ||
            typeof result.access_token !== 'string') {
            throw new FirebaseAppError(
              AppErrorCodes.INVALID_CREDENTIAL,
              `Invalid access token generated: "${JSON.stringify(result)}". Valid access ` +
              'tokens must be an object with the "expires_in" (number) and "access_token" ' +
              '(string) properties.',
            );
          }

          const token: FirebaseAccessToken = {
            accessToken: result.access_token,
            expirationTime: Date.now() + (result.expires_in * 1000),
          };

          const hasAccessTokenChanged = (this.cachedToken_ && this.cachedToken_.accessToken !== token.accessToken);
          const hasExpirationChanged = (this.cachedToken_ && this.cachedToken_.expirationTime !== token.expirationTime);
          if (!this.cachedToken_ || hasAccessTokenChanged || hasExpirationChanged) {
            this.cachedToken_ = token;
            this.tokenListeners_.forEach((listener) => {
              listener(token.accessToken);
            });
          }

          // Establish a timeout to proactively refresh the token every minute starting at five
          // minutes before it expires. Once a token refresh succeeds, no further retries are
          // needed; if it fails, retry every minute until the token expires (resulting in a total
          // of four retries: at 4, 3, 2, and 1 minutes).
          let refreshTimeInSeconds = (result.expires_in - (5 * 60));
          let numRetries = 4;

          // In the rare cases the token is short-lived (that is, it expires in less than five
          // minutes from when it was fetched), establish the timeout to refresh it after the
          // current minute ends and update the number of retries that should be attempted before
          // the token expires.
          if (refreshTimeInSeconds <= 0) {
            refreshTimeInSeconds = result.expires_in % 60;
            numRetries = Math.floor(result.expires_in / 60) - 1;
          }

          // The token refresh timeout keeps the Node.js process alive, so only create it if this
          // instance has not already been deleted.
          if (numRetries && !this.isDeleted_) {
            this.setTokenRefreshTimeout(refreshTimeInSeconds * 1000, numRetries);
          }

          return token;
        })
        .catch((error) => {
          let errorMessage = (typeof error === 'string') ? error : error.message;

          errorMessage = 'Credential implementation provided to initializeApp() via the ' +
            '"credential" property failed to fetch a valid Google OAuth2 access token with the ' +
            `following error: "${errorMessage}".`;

          if (errorMessage.indexOf('invalid_grant') !== -1) {
            errorMessage += ' There are two likely causes: (1) your server time is not properly ' +
            'synced or (2) your certificate key file has been revoked. To solve (1), re-sync the ' +
            'time on your server. To solve (2), make sure the key ID for your key file is still ' +
            'present at https://console.firebase.google.com/iam-admin/serviceaccounts/project. If ' +
            'not, generate a new key file at ' +
            'https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk.';
          }

          throw new FirebaseAppError(AppErrorCodes.INVALID_CREDENTIAL, errorMessage);
        });

      return this.cachedTokenPromise_;
    }
  }

  /**
   * Adds a listener that is called each time a token changes.
   *
   * @param {function(string)} listener The listener that will be called with each new token.
   */
  public addAuthTokenListener(listener: (token: string) => void): void {
    this.tokenListeners_.push(listener);
    if (this.cachedToken_) {
      listener(this.cachedToken_.accessToken);
    }
  }

  /**
   * Removes a token listener.
   *
   * @param {function(string)} listener The listener to remove.
   */
  public removeAuthTokenListener(listener: (token: string) => void): void {
    this.tokenListeners_ = this.tokenListeners_.filter((other) => other !== listener);
  }

  /**
   * Deletes the FirebaseAppInternals instance.
   */
  public delete(): void {
    this.isDeleted_ = true;

    // Clear the token refresh timeout so it doesn't keep the Node.js process alive.
    clearTimeout(this.tokenRefreshTimeout_);
  }

  /**
   * Establishes timeout to refresh the Google OAuth2 access token used by the SDK.
   *
   * @param {number} delayInMilliseconds The delay to use for the timeout.
   * @param {number} numRetries The number of times to retry fetching a new token if the prior fetch
   *   failed.
   */
  private setTokenRefreshTimeout(delayInMilliseconds: number, numRetries: number): void {
    this.tokenRefreshTimeout_ = setTimeout(() => {
      this.getToken(/* forceRefresh */ true)
        .catch(() => {
          // Ignore the error since this might just be an intermittent failure. If we really cannot
          // refresh the token, an error will be logged once the existing token expires and we try
          // to fetch a fresh one.
          if (numRetries > 0) {
            this.setTokenRefreshTimeout(60 * 1000, numRetries - 1);
          }
        });
    }, delayInMilliseconds);
  }
}

/**
 * Global context object for a collection of services using a shared authentication state.
 *
 * @internal
 */
export class FirebaseApp implements app.App {
  public INTERNAL: FirebaseAppInternals;

  private name_: string;
  private options_: AppOptions;
  private services_: {[name: string]: unknown} = {};
  private isDeleted_ = false;

  constructor(options: AppOptions, name: string, private firebaseInternals_: FirebaseNamespaceInternals) {
    this.name_ = name;
    this.options_ = deepCopy(options);

    if (!validator.isNonNullObject(this.options_)) {
      throw new FirebaseAppError(
        AppErrorCodes.INVALID_APP_OPTIONS,
        'Invalid Firebase app options passed as the first argument to initializeApp() for the ' +
        `app named "${this.name_}". Options must be a non-null object.`,
      );
    }

    const hasCredential = ('credential' in this.options_);
    if (!hasCredential) {
      this.options_.credential = getApplicationDefault(this.options_.httpAgent);
    }

    const credential = this.options_.credential;
    if (typeof credential !== 'object' || credential === null || typeof credential.getAccessToken !== 'function') {
      throw new FirebaseAppError(
        AppErrorCodes.INVALID_APP_OPTIONS,
        'Invalid Firebase app options passed as the first argument to initializeApp() for the ' +
        `app named "${this.name_}". The "credential" property must be an object which implements ` +
        'the Credential interface.',
      );
    }

    this.INTERNAL = new FirebaseAppInternals(credential);
  }

  /**
   * Returns the Auth service instance associated with this app.
   *
   * @return The Auth service instance of this app.
   */
  public auth(): Auth {
    const fn = require('../auth/index').getAuth;
    return fn(this);
  }

  /**
   * Returns the Database service for the specified URL, and the current app.
   *
   * @return The Database service instance of this app.
   */
  public database(url?: string): Database {
    const fn = require('../database/index').getDatabaseWithUrl;
    return fn(url, this);
  }

  /**
   * Returns the Messaging service instance associated with this app.
   *
   * @return The Messaging service instance of this app.
   */
  public messaging(): Messaging {
    const fn = require('../messaging/index').getMessaging;
    return fn(this);
  }

  /**
   * Returns the Storage service instance associated with this app.
   *
   * @return The Storage service instance of this app.
   */
  public storage(): Storage {
    const fn = require('../storage/index').getStorage;
    return fn(this);
  }

  public firestore(): Firestore {
    const fn = require('../firestore/index').getFirestore;
    return fn(this);
  }

  /**
   * Returns the InstanceId service instance associated with this app.
   *
   * @return The InstanceId service instance of this app.
   */
  public instanceId(): InstanceId {
    const fn = require('../instance-id/index').getInstanceId;
    return fn(this);
  }

  /**
   * Returns the MachineLearning service instance associated with this app.
   *
   * @return The Machine Learning service instance of this app
   */
  public machineLearning(): MachineLearning {
    const fn = require('../machine-learning/index').getMachineLearning;
    return fn(this);
  }

  /**
   * Returns the ProjectManagement service instance associated with this app.
   *
   * @return The ProjectManagement service instance of this app.
   */
  public projectManagement(): ProjectManagement {
    const fn = require('../project-management/index').getProjectManagement;
    return fn(this);
  }

  /**
   * Returns the SecurityRules service instance associated with this app.
   *
   * @return The SecurityRules service instance of this app.
   */
  public securityRules(): SecurityRules {
    const fn = require('../security-rules/index').getSecurityRules;
    return fn(this);
  }

  /**
   * Returns the RemoteConfig service instance associated with this app.
   *
   * @return The RemoteConfig service instance of this app.
   */
  public remoteConfig(): RemoteConfig {
    const fn = require('../remote-config/index').getRemoteConfig;
    return fn(this);
  }

  /**
   * Returns the name of the FirebaseApp instance.
   *
   * @return The name of the FirebaseApp instance.
   */
  get name(): string {
    this.checkDestroyed_();
    return this.name_;
  }

  /**
   * Returns the options for the FirebaseApp instance.
   *
   * @return The options for the FirebaseApp instance.
   */
  get options(): AppOptions {
    this.checkDestroyed_();
    return deepCopy(this.options_);
  }

  /**
   * @internal
   */
  public getOrInitService<T>(name: string, init: (app: FirebaseApp) => T): T {
    return this.ensureService_(name, () => init(this));
  }

  /**
   * Deletes the FirebaseApp instance.
   *
   * @return An empty Promise fulfilled once the FirebaseApp instance is deleted.
   */
  public delete(): Promise<void> {
    this.checkDestroyed_();
    this.firebaseInternals_.removeApp(this.name_);

    this.INTERNAL.delete();

    return Promise.all(Object.keys(this.services_).map((serviceName) => {
      const service = this.services_[serviceName];
      if (isStateful(service)) {
        return service.delete();
      }
      return Promise.resolve();
    })).then(() => {
      this.services_ = {};
      this.isDeleted_ = true;
    });
  }

  private ensureService_<T>(serviceName: string, initializer: () => T): T {
    this.checkDestroyed_();
    if (!(serviceName in this.services_)) {
      this.services_[serviceName] = initializer();
    }

    return this.services_[serviceName] as T;
  }

  /**
   * Throws an Error if the FirebaseApp instance has already been deleted.
   */
  private checkDestroyed_(): void {
    if (this.isDeleted_) {
      throw new FirebaseAppError(
        AppErrorCodes.APP_DELETED,
        `Firebase app named "${this.name_}" has already been deleted.`,
      );
    }
  }
}

interface StatefulFirebaseService {
  delete(): Promise<void>;
}

function isStateful(service: any): service is StatefulFirebaseService {
  return typeof service.delete === 'function';
}