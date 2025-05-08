// Generic PrismaClient type that works with both Node and Edge versions
// This avoids importing specific createPrisma implementations
export interface GenericPrismaClient {
  post: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  tag: {
    findUnique: (args: any) => Promise<any>;
    findMany: (args?: any) => Promise<any>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  postTag?: {
    findMany: (args?: any) => Promise<any>;
    deleteMany: (args: any) => Promise<any>;
  };
  $disconnect: () => Promise<void>;
}
