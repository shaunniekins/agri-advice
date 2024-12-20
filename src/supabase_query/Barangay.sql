create table
  public."Barangay" (
    barangay_name text not null,
    constraint Barangay_pkey primary key (barangay_name),
    constraint Barangay_barangay_name_key unique (barangay_name)
  ) tablespace pg_default;