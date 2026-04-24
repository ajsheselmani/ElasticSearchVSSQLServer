namespace ElasticSearchVSSQLServer.Indexing.Models.LogsIndexed;

public record LogsReindexResult(
    string IndexName,
    int BatchSize,
    long ScannedCount,
    long IndexedCount,
    long SkippedCount,
    int ProcessedBatches,
    DateTime StartedAtUtc,
    DateTime CompletedAtUtc);
