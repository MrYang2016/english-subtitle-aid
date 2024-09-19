export function parseJson(content: unknown): { [key: string]: unknown } | null {
  try {
    const result = JSON.parse(String(content));
    if (isObject(result)) {
      return result;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 判断是否为对象
 * @param {Object} obj
 */
export function isObject(obj: unknown): obj is { [key: string]: unknown } {
  return obj !== null && obj instanceof Object;
}

export function delay(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time));
}
