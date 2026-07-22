import { ProductRow } from '../Shared/product';

export interface AddProductPayload extends ProductRow {}
export interface UpdateProductPayload extends ProductRow {
  productGuid: string;
}

/**
 * Represents an interface for an inventory service that provides operations related to inventory management.
 */
export interface InventoryServiceInterface {
    getTotalStock(): Promise<unknown>;
    getTotalStockOfMasterCategory(mid: number): Promise<unknown>;
    getAllProducts(itemsPerPage: number, pageNumber: number, searchQuery: string, fetchSoldProducts: number): Promise<unknown>;
    addProduct(addProductFormData: AddProductPayload): Promise<unknown>;
    deleteProduct(productGuid: string, hardDelete: number): Promise<unknown>;
    deleteProductImage(productGuid: string): Promise<unknown>;
    getProductDetails(productGuid: string): Promise<unknown>;
    getProductImage(productGuid: string): Promise<unknown>;
    updateProductDetails(productDetails: UpdateProductPayload): Promise<unknown>;
    updateProductImage(productGuid: string, imagePath: string): Promise<unknown>;
  }
