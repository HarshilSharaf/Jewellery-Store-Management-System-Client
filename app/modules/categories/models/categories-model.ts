interface CategoriesModel {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MasterCategoriesModel extends CategoriesModel {
  masterCategoryName: string;
  masterCategoryDescription: string;
}

export interface SubCategoriesModel extends CategoriesModel {
  subCategoryName: string;
  subCategoryDescription: string;
}

export interface ProductCategoriesModel extends CategoriesModel {
  productCategoryName: string;
  productCategoryDescription: string;
}

export interface AllCategoriesModel {
  masterCategories: MasterCategoriesModel[],
  subCategories: SubCategoriesModel[],
  productCategories: ProductCategoriesModel[]
}