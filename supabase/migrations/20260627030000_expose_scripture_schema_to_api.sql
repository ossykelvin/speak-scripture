ALTER ROLE authenticator
SET pgrst.db_schemas = 'public,storage,graphql_public,scripture';

NOTIFY pgrst, 'reload config';
