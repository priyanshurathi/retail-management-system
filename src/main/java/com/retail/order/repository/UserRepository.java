package com.retail.order.repository;

import com.retail.order.model.User;
import com.retail.order.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmployeeCode(String employeeCode);
    List<User> findByRole(UserRole role);
    List<User> findAllByOrderByEmployeeCodeAsc();
    List<User> findByRoleAndActiveTrueOrderByEmployeeCodeAsc(UserRole role);
}
