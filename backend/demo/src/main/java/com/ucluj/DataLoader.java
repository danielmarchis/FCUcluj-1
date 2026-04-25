package com.ucluj;

import com.ucluj.service.DataIngestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final DataIngestionService ingestionService;

    @Override
    public void run(String... args) throws Exception {
        ingestionService.loadMatchesFromApi();
    }
}