import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('ordersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('productsRepository')
    private productsRepository: IProductsRepository,

    @inject('customersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer ID not found');
    }

    const stockProducts = await this.productsRepository.findAllById(products);
    if (stockProducts.length !== products.length) {
      throw new AppError('One or more product IDs were not found');
    }

    const orderProducts = stockProducts.map((product, index) => {
      return {
        product_id: product.id,
        price: product.price,
        quantity: products[index].quantity,
      };
    });

    stockProducts.forEach((product, index) => {
      if (product.quantity < orderProducts[index].quantity) {
        throw new AppError(
          `Not enough stock for quantity ordered of product: ${product.name}`,
        );
      }
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
