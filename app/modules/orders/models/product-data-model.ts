export interface ProductDataModel {
    id:number,
    productDescription:string,
    productGuid:string,
    productWeight:number,
    image:string,
    imagePath?: string,
    createdAt:string,
    isSold:boolean,
    masterCategory: string,
    subCategory: string,
    productCategory: string
}
