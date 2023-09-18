interface CustomerImageModel {
  oldFileName: string;
}
export interface UpdateCustomerImageModel extends CustomerImageModel {
  imagePath: string;
}

export interface DeleteCustomerImageModel extends CustomerImageModel {}
