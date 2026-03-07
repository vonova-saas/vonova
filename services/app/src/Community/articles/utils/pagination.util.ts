export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class PaginationUtil {
  static createPaginationOptions(
    page?: number,
    limit?: number,
  ): PaginationOptions {
    const parsedPage = Math.max(1, page || 1);
    const parsedLimit = Math.min(100, Math.max(1, limit || 10));

    return {
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  static createPaginationResult<T>(
    data: T[],
    total: number,
    options: PaginationOptions,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / options.limit);

    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNext: options.page < totalPages,
        hasPrev: options.page > 1,
      },
    };
  }

  static getSkipValue(options: PaginationOptions): number {
    return (options.page - 1) * options.limit;
  }
}
