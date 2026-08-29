package com.retail.order.repository;

import com.retail.order.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    List<Shop> findAllByActiveTrueOrderByNameAsc();
    List<Shop> findByNameContainingIgnoreCaseOrOwnerNameContainingIgnoreCaseOrPhoneContaining(String name, String ownerName, String phone);
    List<Shop> findByTerritoryIgnoreCaseAndActiveTrue(String territory);
}
