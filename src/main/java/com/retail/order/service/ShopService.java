package com.retail.order.service;

import com.retail.order.dto.ShopCreateRequest;
import com.retail.order.model.Shop;
import com.retail.order.repository.ShopRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ShopService {

    private final ShopRepository shopRepository;

    public ShopService(ShopRepository shopRepository) {
        this.shopRepository = shopRepository;
    }

    public List<Shop> getAllShops() {
        return shopRepository.findAllByActiveTrueOrderByNameAsc();
    }

    public List<Shop> searchShops(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllShops();
        }
        return shopRepository.findByNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPhoneContaining(
                query.trim(), query.trim(), query.trim());
    }

    public Optional<Shop> getShopById(Long id) {
        return shopRepository.findById(id);
    }

    public Shop createShop(ShopCreateRequest request) {
        Shop shop = new Shop(
                request.getName(),
                request.getOwnerName(),
                request.getPhone(),
                request.getAddress(),
                request.getTerritory() != null ? request.getTerritory() : "General Territory",
                request.getEmail(),
                request.getGstNumber()
        );
        return shopRepository.save(shop);
    }
}
