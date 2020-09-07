import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(productsData: IFindProducts[]): Promise<Product[]> {
    const productsIds = productsData.map(productData => productData.id);

    const products = await this.ormRepository.find({
      where: { id: In(productsIds) },
    });

    return products;
  }

  public async updateQuantity(
    productsData: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsIds = productsData.map(productData => productData.id);

    const products = await this.ormRepository.find({
      where: { id: In(productsIds) },
    });

    const updatedProducts = products.map((product, index) => {
      return {
        ...product,
        quantity: product.quantity - productsData[index].quantity,
      };
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
