export interface MonthlySalesAndLabourModel {
    labour: number,
    month_year: string,
    sales: number
}

export interface SalesAndLabourModel {
    monthlySalesAndLabour: MonthlySalesAndLabourModel[]
}