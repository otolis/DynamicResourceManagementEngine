# ADR-001: Meta-Schema Architecture

## Status

Accepted

## Context

DRME needs to support dynamic business entities without code changes. Traditional ERP systems require database migrations and code deployments to add new entity types or fields.

## Decision

Implement a meta-schema (Entity-Attribute-Value variant) architecture where:

1. `entityType` table defines business object types (Project, Task, Invoice)
2. `attribute` table defines fields for each entity type
3. `entityInstance` stores actual records
4. `attributeValue` stores field values using polymorphic columns

This allows adding new entity types and fields via database configuration only.

## Consequences

**Positive:**
- New entity types without code deployment
- Dynamic form generation from schema
- Flexible attribute configuration

**Negative:**
- More complex queries (joins for each attribute)
- Requires careful indexing strategy
- Schema validation at application layer
