package com.yigithas.falafal.controller; // Kendi paket adını kontrol et

import com.yigithas.falafal.dto.FalIstekDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FalController {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/fal-bak")
    public ResponseEntity<?> falBak(@RequestBody FalIstekDTO istek) {
        try {
            // 1. Elindeki cURL'de yazan KESİN ÇALIŞAN URL adresi:
            String tamUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

            // 2. Google'ın cURL'de beklediği JSON yapısı
            String jsonGovdesi = "{"
                    + "\"contents\": [{"
                    + "  \"parts\": ["
                    + "    {\"text\": \"" + istek.promptMetni().replace("\"", "\\\"").replace("\n", " ") + "\"},"
                    + "    {"
                    + "      \"inlineData\": {"
                    + "        \"mimeType\": \"image/jpeg\","
                    + "        \"data\": \"" + istek.base64Resim() + "\""
                    + "      }"
                    + "    }"
                    + "  ]"
                    + "}]"
                    + "}";

            // 3. HTTP Header Ayarları (cURL'deki -H kısımları)
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // 🔑 API Anahtarını cURL'de olduğu gibi Header'a ekliyoruz:
            headers.set("X-goog-api-key", apiKey); 

            HttpEntity<String> entity = new HttpEntity<>(jsonGovdesi, headers);

            // İsteği gönderiyoruz
            ResponseEntity<Map> response = restTemplate.postForEntity(tamUrl, entity, Map.class);

            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Sistem Hatası: " + e.getMessage()));
        }
    }
}