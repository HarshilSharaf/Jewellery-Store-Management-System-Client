export interface CustomerDetails {
    id:number,
    customerId?: number,
    customerGuid?:string
    firstName: string,
    lastName: string,
    dateOfBirth?: string,
    customerName: string,
    phoneNumber: number,
    imagePath?: string,
    image?: string,
    gender: string,
    address: string,
    city: string,
    state: string,
    email: string
}