package com.retail.order.service;

import com.retail.order.dto.LoginRequest;
import com.retail.order.dto.LoginResponse;
import com.retail.order.model.User;
import com.retail.order.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.getIdentifier() == null || request.getIdentifier().trim().isEmpty()) {
            return new LoginResponse(false, "Employee code or username is required", null);
        }

        String id = request.getIdentifier().trim();
        Optional<User> userOpt = userRepository.findByUsername(id);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmployeeCode(id.toUpperCase());
        }

        if (userOpt.isEmpty()) {
            return new LoginResponse(false, "User not found with identifier: " + id, null);
        }

        User user = userOpt.get();
        if (!user.isActive()) {
            return new LoginResponse(false, "User account is inactive", null);
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return new LoginResponse(false, "Password is required", null);
        }

        if (!user.getPassword().equals(request.getPassword().trim())) {
            return new LoginResponse(false, "Invalid password", null);
        }

        return new LoginResponse(true, "Login successful", user);
    }

    public List<User> getAllEmployees() {
        return userRepository.findAllByOrderByEmployeeCodeAsc();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
}
