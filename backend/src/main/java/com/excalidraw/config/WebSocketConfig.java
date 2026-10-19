package com.excalidraw.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker prefix for broadcasting to clients
        config.enableSimpleBroker("/topic", "/queue");
        // Application destination prefix for incoming messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket STOMP endpoint
        registry.addEndpoint("/ws", "/ws/drawings/{id}")
                .setAllowedOriginPatterns("*");

        // Fallback with SockJS support
        registry.addEndpoint("/ws", "/ws/drawings/{id}")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
