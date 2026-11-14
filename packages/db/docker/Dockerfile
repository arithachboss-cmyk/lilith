# Local development database: PostgreSQL 16 with PostGIS and pgvector.
#
# Both sources are official images of the same family (PostgreSQL 16 on
# Debian trixie), pinned by digest, so the build is reproducible and needs no
# package downloads. PostGIS comes with the base image; the pgvector extension
# files are copied from the pgvector image. pg_trgm, pgcrypto and citext ship
# with PostgreSQL itself.
FROM pgvector/pgvector:0.8.7-pg16-trixie@sha256:c28c0b700f3f1b5eec14082b31ad6e7c8a566d14386323609c615315e7c0ffc8 AS pgvector

FROM postgis/postgis:16-3.6@sha256:d07ce3f06f657b6516c7511412232e97174d7e9dcf4c9fe520109b682b44a201

COPY --from=pgvector /usr/lib/postgresql/16/lib/vector.so /usr/lib/postgresql/16/lib/vector.so
COPY --from=pgvector /usr/lib/postgresql/16/lib/bitcode/vector /usr/lib/postgresql/16/lib/bitcode/vector
COPY --from=pgvector /usr/lib/postgresql/16/lib/bitcode/vector.index.bc /usr/lib/postgresql/16/lib/bitcode/vector.index.bc
COPY --from=pgvector /usr/share/postgresql/16/extension/vector.control /usr/share/postgresql/16/extension/
COPY --from=pgvector /usr/share/postgresql/16/extension/vector--*.sql /usr/share/postgresql/16/extension/
