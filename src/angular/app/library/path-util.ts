export class PathUtil {
  private static readonly WINDOWS_PATH_REGEX = /^[A-Za-z]:/;
  private static readonly WINDOWS_PATH_SEPARATOR = '\\';
  private static readonly POSIX_PATH_SEPARATOR = '/';

  static resolve(...paths: string[]): string {
    if (paths.length === 0) return '';

    let resolvedPath = '';
    let isAbsolute = false;

    for (let i = paths.length - 1; i >= 0; i--) {
      const path = paths[i];
      if (!path) continue;

      if (PathUtil.isAbsolute(path)) {
        resolvedPath = path;
        isAbsolute = true;
        break;
      }

      resolvedPath = resolvedPath ? PathUtil.join(path, resolvedPath) : path;
    }

    if (!isAbsolute) {
      resolvedPath = resolvedPath || '.';
    }

    return PathUtil.normalize(resolvedPath);
  }

  static join(...paths: string[]): string {
    if (paths.length === 0) return '.';

    const filteredPaths = paths.filter(path => path && path.length > 0);
    if (filteredPaths.length === 0) return '.';

    const joined = filteredPaths.join(PathUtil.WINDOWS_PATH_SEPARATOR);
    return PathUtil.normalize(joined);
  }

  static dirname(path: string): string {
    if (!path || path.length === 0) return '.';

    const normalizedPath = PathUtil.normalize(path);
    const parts = normalizedPath.split(PathUtil.WINDOWS_PATH_SEPARATOR);

    if (parts.length === 1) {
      if (PathUtil.WINDOWS_PATH_REGEX.test(parts[0])) {
        return parts[0] + PathUtil.WINDOWS_PATH_SEPARATOR;
      }
      return '.';
    }

    parts.pop();
    const result = parts.join(PathUtil.WINDOWS_PATH_SEPARATOR);
    return result.length > 0 ? result : PathUtil.WINDOWS_PATH_SEPARATOR;
  }

  static basename(path: string, ext?: string): string {
    if (!path || path.length === 0) return '';

    const normalizedPath = PathUtil.normalize(path);
    const parts = normalizedPath.split(PathUtil.WINDOWS_PATH_SEPARATOR);
    let base = parts[parts.length - 1] || '';

    if (ext && base.endsWith(ext)) {
      base = base.substring(0, base.length - ext.length);
    }

    return base;
  }

  static extname(path: string): string {
    if (!path || path.length === 0) return '';

    const normalizedPath = PathUtil.normalize(path);
    const base = PathUtil.basename(normalizedPath);

    const dotIndex = base.lastIndexOf('.');
    if (dotIndex === -1 || dotIndex === 0) return '';

    return base.substring(dotIndex);
  }

  static isAbsolute(path: string): boolean {
    if (!path || path.length === 0) return false;

    if (PathUtil.WINDOWS_PATH_REGEX.test(path)) {
      return true;
    }

    if (path.startsWith(PathUtil.WINDOWS_PATH_SEPARATOR) || 
        path.startsWith(PathUtil.POSIX_PATH_SEPARATOR)) {
      return true;
    }

    return false;
  }

  static normalize(path: string): string {
    if (!path || path.length === 0) return '.';

    let normalized = path.replace(/\//g, PathUtil.WINDOWS_PATH_SEPARATOR);

    const isWinAbsolute = PathUtil.WINDOWS_PATH_REGEX.test(normalized);
    const parts = normalized.split(PathUtil.WINDOWS_PATH_SEPARATOR);
    const resultParts: string[] = [];

    for (const part of parts) {
      if (part === '' || part === '.') {
        continue;
      } else if (part === '..') {
        if (resultParts.length > 0 && resultParts[resultParts.length - 1] !== '..') {
          if (PathUtil.WINDOWS_PATH_REGEX.test(resultParts[0]) && resultParts.length === 1) {
            continue;
          }
          resultParts.pop();
        } else if (!isWinAbsolute) {
          resultParts.push(part);
        }
      } else {
        resultParts.push(part);
      }
    }

    let result = resultParts.join(PathUtil.WINDOWS_PATH_SEPARATOR);

    if (isWinAbsolute) {
      const driveMatch = normalized.match(PathUtil.WINDOWS_PATH_REGEX);
      if (driveMatch && !result.startsWith(driveMatch[0])) {
        result = driveMatch[0] + PathUtil.WINDOWS_PATH_SEPARATOR + result;
      }
    }

    if (path.startsWith(PathUtil.WINDOWS_PATH_SEPARATOR) && !PathUtil.WINDOWS_PATH_REGEX.test(result)) {
      result = PathUtil.WINDOWS_PATH_SEPARATOR + result;
    }

    return result || '.';
  }

  static relative(from: string, to: string): string {
    if (!from || !to) return '';

    const normalizedFrom = PathUtil.normalize(from);
    const normalizedTo = PathUtil.normalize(to);

    if (normalizedFrom === normalizedTo) return '';

    const fromParts = normalizedFrom.split(PathUtil.WINDOWS_PATH_SEPARATOR);
    const toParts = normalizedTo.split(PathUtil.WINDOWS_PATH_SEPARATOR);

    const fromDrive = fromParts[0].match(PathUtil.WINDOWS_PATH_REGEX)?.[0];
    const toDrive = toParts[0].match(PathUtil.WINDOWS_PATH_REGEX)?.[0];

    if (fromDrive && toDrive && fromDrive.toUpperCase() !== toDrive.toUpperCase()) {
      return normalizedTo;
    }

    let commonLength = 0;
    const minLength = Math.min(fromParts.length, toParts.length);

    for (let i = 0; i < minLength; i++) {
      if (fromParts[i].toUpperCase() === toParts[i].toUpperCase()) {
        commonLength++;
      } else {
        break;
      }
    }

    const upLevels = fromParts.length - commonLength;
    const relativeParts: string[] = [];

    for (let i = 0; i < upLevels; i++) {
      relativeParts.push('..');
    }

    for (let i = commonLength; i < toParts.length; i++) {
      relativeParts.push(toParts[i]);
    }

    return relativeParts.join(PathUtil.WINDOWS_PATH_SEPARATOR) || '.';
  }
}
