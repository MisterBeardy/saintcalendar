// Utility functions for validating React keys to prevent duplicate key errors

/**
 * Validates that an array of items doesn't contain duplicate keys based on a key extractor function
 * @param items Array of items to validate
 * @param keyExtractor Function that extracts the key from each item
 * @param context Optional context string for logging
 */
export function validateUniqueKeys<T>(
  items: T[], 
  keyExtractor: (item: T) => string | number, 
  context?: string
): void {
  const keys = items.map(item => keyExtractor(item));
  const uniqueKeys = new Set(keys);
  
  if (keys.length !== uniqueKeys.size) {
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    console.warn(
      `Duplicate keys detected${context ? ` in ${context}` : ''}:`, 
      [...new Set(duplicates)]
    );
  }
}

/**
 * Validates that an array of items doesn't contain duplicate keys based on a key property
 * @param items Array of items to validate
 * @param keyProperty The property name to use as the key
 * @param context Optional context string for logging
 */
export function validateUniqueKeysByProperty<T>(
  items: T[], 
  keyProperty: keyof T, 
  context?: string
): void {
  validateUniqueKeys(
    items, 
    (item) => item[keyProperty] as string | number, 
    context
  );
}

/**
 * Generates a unique key for React components by combining the item's key with its index
 * @param item The item to generate a key for
 * @param keyExtractor Function that extracts the key from the item
 * @param index The index of the item in the array
 * @returns A unique key string
 */
export function generateUniqueKey<T>(
  item: T, 
  keyExtractor: (item: T) => string | number, 
  index: number
): string {
  return `${keyExtractor(item)}-${index}`;
}

/**
 * Generates a unique key for React components by combining a property with the index
 * @param item The item to generate a key for
 * @param keyProperty The property name to use as the key
 * @param index The index of the item in the array
 * @returns A unique key string
 */
export function generateUniqueKeyByProperty<T>(
  item: T, 
  keyProperty: keyof T, 
  index: number
): string {
  return `${item[keyProperty]}-${index}`;
}

/**
 * Generates a globally unique key using a combination of timestamp and random string
 * @returns A unique key string
 */
export function generateUniqueKeyString(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generates a unique key for React components by combining item data with a unique identifier
 * @param item The item to generate a key for
  * @param keyProperty The property name to use as the key
 * @returns A unique key string
 */
export function generateUniqueReactKey<T>(
  item: T,
  keyProperty: keyof T
): string {
  return `${item[keyProperty]}-${generateUniqueKeyString()}`;
}