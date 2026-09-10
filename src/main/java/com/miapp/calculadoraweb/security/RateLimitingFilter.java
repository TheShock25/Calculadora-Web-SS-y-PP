package com.miapp.calculadoraweb.security;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter implements Filter {

    private static final int MAX_REQUESTS_PER_MINUTE = 120;
    private static final long WINDOW_MILLIS = 60_000L;

    private static class RequestCount {
        long windowStart;
        final AtomicInteger count = new AtomicInteger(0);

        RequestCount(long start) {
            this.windowStart = start;
        }
    }

    private final Map<String, RequestCount> ipRequestCounts = new ConcurrentHashMap<>();
    private long lastCleanupTime = System.currentTimeMillis();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
            String uri = httpRequest.getRequestURI();

            // Aplicar rate limiting solo a los endpoints de la API
            if (uri != null && uri.startsWith("/api/")) {
                String clientIp = obtenerIpCliente(httpRequest);
                long now = System.currentTimeMillis();

                limpiarRegistrosAntiguosSiEsNecesario(now);

                RequestCount reqCount = ipRequestCounts.compute(clientIp, (ip, current) -> {
                    if (current == null || (now - current.windowStart) > WINDOW_MILLIS) {
                        RequestCount nuevo = new RequestCount(now);
                        nuevo.count.set(1);
                        return nuevo;
                    }
                    current.count.incrementAndGet();
                    return current;
                });

                if (reqCount.count.get() > MAX_REQUESTS_PER_MINUTE) {
                    httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    httpResponse.setContentType("application/json;charset=UTF-8");
                    httpResponse.setHeader("Retry-After", "60");
                    httpResponse.getWriter().write(
                            "{\"success\":false,\"error\":\"Demasiadas peticiones. Por favor, espere un momento.\"}"
                    );
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private String obtenerIpCliente(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "desconocida";
    }

    private synchronized void limpiarRegistrosAntiguosSiEsNecesario(long now) {
        if (now - lastCleanupTime > WINDOW_MILLIS * 5) {
            ipRequestCounts.entrySet().removeIf(entry -> (now - entry.getValue().windowStart) > WINDOW_MILLIS);
            lastCleanupTime = now;
        }
    }
}
