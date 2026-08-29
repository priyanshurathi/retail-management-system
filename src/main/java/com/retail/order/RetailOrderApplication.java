package com.retail.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RetailOrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(RetailOrderApplication.class, args);
        System.out.println("\n========================================================");
        System.out.println("🚀 B2B Retail Field Sales & Admin Order System Running!");
        System.out.println("👉 Access Web Portal: http://localhost:8080");
        System.out.println("👉 Embedded H2 DB Console: http://localhost:8080/h2-console");
        System.out.println("========================================================\n");
    }
}
