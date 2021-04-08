The Firebase `SecurityRules` service interface.

<b>Signature:</b>

```typescript
export declare class SecurityRules 
```

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [app](./firebase-admin.security-rules.securityrules.md#securityrulesapp) |  | App |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [createRuleset(file)](./firebase-admin.security-rules.securityrules.md#securityrulescreateruleset) |  | Creates a new  from the given . |
|  [createRulesFileFromSource(name, source)](./firebase-admin.security-rules.securityrules.md#securityrulescreaterulesfilefromsource) |  | Creates a  with the given name and source. Throws an error if any of the arguments are invalid. This is a local operation, and does not involve any network API calls. |
|  [deleteRuleset(name)](./firebase-admin.security-rules.securityrules.md#securityrulesdeleteruleset) |  | Deletes the  identified by the given name. The input name should be the short name string without the project ID prefix. For example, to delete the <code>projects/project-id/rulesets/my-ruleset</code>, pass the short name "my-ruleset". Rejects with a <code>not-found</code> error if the specified <code>Ruleset</code> cannot be found. |
|  [getFirestoreRuleset()](./firebase-admin.security-rules.securityrules.md#securityrulesgetfirestoreruleset) |  | Gets the  currently applied to Cloud Firestore. Rejects with a <code>not-found</code> error if no ruleset is applied on Firestore. A promise that fulfills with the Firestore ruleset. |
|  [getRuleset(name)](./firebase-admin.security-rules.securityrules.md#securityrulesgetruleset) |  | Gets the  identified by the given name. The input name should be the short name string without the project ID prefix. For example, to retrieve the <code>projects/project-id/rulesets/my-ruleset</code>, pass the short name "my-ruleset". Rejects with a <code>not-found</code> error if the specified <code>Ruleset</code> cannot be found. |
|  [getStorageRuleset(bucket)](./firebase-admin.security-rules.securityrules.md#securityrulesgetstorageruleset) |  | Gets the  currently applied to a Cloud Storage bucket. Rejects with a <code>not-found</code> error if no ruleset is applied on the bucket. |
|  [listRulesetMetadata(pageSize, nextPageToken)](./firebase-admin.security-rules.securityrules.md#securityruleslistrulesetmetadata) |  | Retrieves a page of ruleset metadata. |
|  [releaseFirestoreRuleset(ruleset)](./firebase-admin.security-rules.securityrules.md#securityrulesreleasefirestoreruleset) |  | Applies the specified  ruleset to Cloud Firestore. |
|  [releaseFirestoreRulesetFromSource(source)](./firebase-admin.security-rules.securityrules.md#securityrulesreleasefirestorerulesetfromsource) |  | Creates a new  from the given source, and applies it to Cloud Firestore. |
|  [releaseStorageRuleset(ruleset, bucket)](./firebase-admin.security-rules.securityrules.md#securityrulesreleasestorageruleset) |  | Applies the specified  ruleset to a Cloud Storage bucket. |
|  [releaseStorageRulesetFromSource(source, bucket)](./firebase-admin.security-rules.securityrules.md#securityrulesreleasestoragerulesetfromsource) |  | Creates a new  from the given source, and applies it to a Cloud Storage bucket. |

## SecurityRules.app

<b>Signature:</b>

```typescript
readonly app: App;
```

## SecurityRules.createRuleset()

Creates a new  from the given .

<b>Signature:</b>

```typescript
createRuleset(file: RulesFile): Promise<Ruleset>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  file | [RulesFile](./firebase-admin.security-rules.rulesfile.md#rulesfile_interface) | Rules file to include in the new <code>Ruleset</code>. |

<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;

A promise that fulfills with the newly created `Ruleset`<!-- -->.

## SecurityRules.createRulesFileFromSource()

Creates a  with the given name and source. Throws an error if any of the arguments are invalid. This is a local operation, and does not involve any network API calls.

<b>Signature:</b>

```typescript
createRulesFileFromSource(name: string, source: string | Buffer): RulesFile;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  name | string | Name to assign to the rules file. This is usually a short file name that helps identify the file in a ruleset. |
|  source | string \| Buffer | Contents of the rules file.  A new rules file instance. |

<b>Returns:</b>

[RulesFile](./firebase-admin.security-rules.rulesfile.md#rulesfile_interface)

### Example


```javascript
const source = '// Some rules source';
const rulesFile = admin.securityRules().createRulesFileFromSource(
  'firestore.rules', source);

```

## SecurityRules.deleteRuleset()

Deletes the  identified by the given name. The input name should be the short name string without the project ID prefix. For example, to delete the `projects/project-id/rulesets/my-ruleset`<!-- -->, pass the short name "my-ruleset". Rejects with a `not-found` error if the specified `Ruleset` cannot be found.

<b>Signature:</b>

```typescript
deleteRuleset(name: string): Promise<void>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  name | string | Name of the <code>Ruleset</code> to delete.  A promise that fulfills when the <code>Ruleset</code> is deleted. |

<b>Returns:</b>

Promise&lt;void&gt;

## SecurityRules.getFirestoreRuleset()

Gets the  currently applied to Cloud Firestore. Rejects with a `not-found` error if no ruleset is applied on Firestore.

 A promise that fulfills with the Firestore ruleset.

<b>Signature:</b>

```typescript
getFirestoreRuleset(): Promise<Ruleset>;
```
<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;

## SecurityRules.getRuleset()

Gets the  identified by the given name. The input name should be the short name string without the project ID prefix. For example, to retrieve the `projects/project-id/rulesets/my-ruleset`<!-- -->, pass the short name "my-ruleset". Rejects with a `not-found` error if the specified `Ruleset` cannot be found.

<b>Signature:</b>

```typescript
getRuleset(name: string): Promise<Ruleset>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  name | string | Name of the <code>Ruleset</code> to retrieve.  A promise that fulfills with the specified <code>Ruleset</code>. |

<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;

## SecurityRules.getStorageRuleset()

Gets the  currently applied to a Cloud Storage bucket. Rejects with a `not-found` error if no ruleset is applied on the bucket.

<b>Signature:</b>

```typescript
getStorageRuleset(bucket?: string): Promise<Ruleset>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  bucket | string | Optional name of the Cloud Storage bucket to be retrieved. If not specified, retrieves the ruleset applied on the default bucket configured via <code>AppOptions</code>.  A promise that fulfills with the Cloud Storage ruleset. |

<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;

## SecurityRules.listRulesetMetadata()

Retrieves a page of ruleset metadata.

<b>Signature:</b>

```typescript
listRulesetMetadata(pageSize?: number, nextPageToken?: string): Promise<RulesetMetadataList>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  pageSize | number | The page size, 100 if undefined. This is also the maximum allowed limit. |
|  nextPageToken | string | The next page token. If not specified, returns rulesets starting without any offset.  A promise that fulfills with a page of rulesets. |

<b>Returns:</b>

Promise&lt;[RulesetMetadataList](./firebase-admin.security-rules.rulesetmetadatalist.md#rulesetmetadatalist_class)<!-- -->&gt;

## SecurityRules.releaseFirestoreRuleset()

Applies the specified  ruleset to Cloud Firestore.

<b>Signature:</b>

```typescript
releaseFirestoreRuleset(ruleset: string | RulesetMetadata): Promise<void>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  ruleset | string \| [RulesetMetadata](./firebase-admin.security-rules.rulesetmetadata.md#rulesetmetadata_interface) | Name of the ruleset to apply or a <code>RulesetMetadata</code> object containing the name.  A promise that fulfills when the ruleset is released. |

<b>Returns:</b>

Promise&lt;void&gt;

## SecurityRules.releaseFirestoreRulesetFromSource()

Creates a new  from the given source, and applies it to Cloud Firestore.

<b>Signature:</b>

```typescript
releaseFirestoreRulesetFromSource(source: string | Buffer): Promise<Ruleset>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  source | string \| Buffer | Rules source to apply.  A promise that fulfills when the ruleset is created and released. |

<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;

## SecurityRules.releaseStorageRuleset()

Applies the specified  ruleset to a Cloud Storage bucket.

<b>Signature:</b>

```typescript
releaseStorageRuleset(ruleset: string | RulesetMetadata, bucket?: string): Promise<void>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  ruleset | string \| [RulesetMetadata](./firebase-admin.security-rules.rulesetmetadata.md#rulesetmetadata_interface) | Name of the ruleset to apply or a <code>RulesetMetadata</code> object containing the name. |
|  bucket | string | Optional name of the Cloud Storage bucket to apply the rules on. If not specified, applies the ruleset on the default bucket configured via .  A promise that fulfills when the ruleset is released. |

<b>Returns:</b>

Promise&lt;void&gt;

## SecurityRules.releaseStorageRulesetFromSource()

Creates a new  from the given source, and applies it to a Cloud Storage bucket.

<b>Signature:</b>

```typescript
releaseStorageRulesetFromSource(source: string | Buffer, bucket?: string): Promise<Ruleset>;
```

### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  source | string \| Buffer | Rules source to apply. |
|  bucket | string | Optional name of the Cloud Storage bucket to apply the rules on. If not specified, applies the ruleset on the default bucket configured via .  A promise that fulfills when the ruleset is created and released. |

<b>Returns:</b>

Promise&lt;[Ruleset](./firebase-admin.security-rules.ruleset.md#ruleset_class)<!-- -->&gt;
