# Worker

Separate process reserved for pg-boss jobs. ARCH-001 compiles the entrypoint; running it deliberately exits with code 78 and a structured diagnostic because no queue is configured. It does not claim to process jobs. Database setup belongs to ARCH-004; job implementations follow their Blueprint tasks.
