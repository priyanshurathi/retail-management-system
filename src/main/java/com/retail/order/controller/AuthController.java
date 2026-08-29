package com.retail.order.controller;

import com.retail.order.dto.LoginRequest;
import com.retail.order.dto.LoginResponse;
import com.retail.order.model.User;
import com.retail.order.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/demo-users")
    public ResponseEntity<List<User>> getDemoUsers() {
        return ResponseEntity.ok(authService.getAllEmployees());
    }
}
