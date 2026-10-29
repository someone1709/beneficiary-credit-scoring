package com.creditscore.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class WebClientConfig {

    @Value("${ml.service.base-url}")
    private String mlServiceBaseUrl;

    @Bean
    public WebClient mlWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl(mlServiceBaseUrl)
                .build();
    }
}
