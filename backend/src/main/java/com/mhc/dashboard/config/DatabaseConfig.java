package com.mhc.dashboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Value("${SPRING_DATASOURCE_URL:${DATABASE_URL:}}")
    private String dbUrl;

    @Value("${SPRING_DATASOURCE_USERNAME:${DATABASE_USERNAME:mhcuser}}")
    private String username;

    @Value("${SPRING_DATASOURCE_PASSWORD:${DATABASE_PASSWORD:password}}")
    private String password;

    @Bean
    public DataSource dataSource() {
        String finalUrl = dbUrl;
        if (finalUrl != null && !finalUrl.startsWith("jdbc:")) {
            if (finalUrl.startsWith("postgres://")) {
                finalUrl = finalUrl.replace("postgres://", "jdbc:postgresql://");
            } else if (finalUrl.startsWith("postgresql://")) {
                finalUrl = "jdbc:" + finalUrl;
            }
        }
        return DataSourceBuilder.create()
                .url(finalUrl)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
