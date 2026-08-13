package com.mhc.dashboard.security;

import com.mhc.dashboard.models.User;
import com.mhc.dashboard.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InitialUserSetup implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.username:}")
    private String bootstrapUsername;

    @Value("${app.bootstrap.password:}")
    private String bootstrapPassword;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0 && !bootstrapUsername.isEmpty() && !bootstrapPassword.isEmpty()) {
            User user = new User();
            user.setUsername(bootstrapUsername);
            user.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
            user.setRole("ROLE_USER");
            userRepository.save(user);
            System.out.println("Bootstrap user created successfully.");
        }
    }
}
