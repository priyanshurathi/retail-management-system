package com.retail.order.service;

import com.retail.order.model.Product;
import com.retail.order.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAllByActiveTrueOrderByCategoryAscNameAsc();
    }

    public List<Product> getProductsByCategory(String category) {
        if (category == null || category.equalsIgnoreCase("ALL") || category.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.findByCategoryIgnoreCaseAndActiveTrueOrderByNameAsc(category.trim());
    }

    public List<Product> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllProducts();
        }
        return productRepository.findByNameContainingIgnoreCaseOrSkuContainingIgnoreCaseAndActiveTrue(query.trim(), query.trim());
    }

    public List<String> getCategories() {
        return productRepository.findAllByActiveTrueOrderByCategoryAscNameAsc()
                .stream()
                .map(Product::getCategory)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
}
