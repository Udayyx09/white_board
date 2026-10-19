package com.excalidraw.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.net.URI;

/**
 * Automatically parses cloud database connection strings (Render, Railway, Heroku)
 * provided in the DATABASE_URL environment variable.
 */
@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();

        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank() && 
            (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            try {
                String uriString = databaseUrl.startsWith("postgres://")
                        ? "postgresql://" + databaseUrl.substring("postgres://".length())
                        : databaseUrl;

                URI dbUri = new URI(uriString);
                String userInfo = dbUri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] credentials = userInfo.split(":", 2);
                    properties.setUsername(credentials[0]);
                    properties.setPassword(credentials[1]);
                }

                int port = dbUri.getPort() > 0 ? dbUri.getPort() : 5432;
                String path = dbUri.getPath();
                String jdbcUrl = "jdbc:postgresql://" + dbUri.getHost() + ":" + port + path;
                if (dbUri.getQuery() != null) {
                    jdbcUrl += "?" + dbUri.getQuery();
                }
                properties.setUrl(jdbcUrl);
                properties.setDriverClassName("org.postgresql.Driver");
            } catch (Exception ignored) {
            }
        }

        return properties;
    }
}
