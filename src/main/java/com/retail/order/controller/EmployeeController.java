package com.retail.order.controller;

import com.retail.order.model.User;
import com.retail.order.model.UserRole;
import com.retail.order.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final UserRepository userRepository;

    public EmployeeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getEmployees() {
        return ResponseEntity.ok(userRepository.findByRoleAndActiveTrueOrderByEmployeeCodeAsc(UserRole.EMPLOYEE));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getEmployeeById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
