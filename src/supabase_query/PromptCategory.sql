create table public."PromptCategory" (
    category_name text not null,
    constraint PromptCategory_pkey primary key (category_name),
    constraint PromptCategory_category_name_key unique (category_name)
) tablespace pg_default;