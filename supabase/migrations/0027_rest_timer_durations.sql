-- Per-user default rest-timer durations, configurable in Settings.
-- Two separate columns rather than one: Main Lift work typically wants a
-- longer rest than Accessory/Log Sets work, and both of the latter two
-- tabs already write through the same logAccessorySet action/table, so
-- they share accessory_rest_seconds rather than getting a third column.
alter table profiles
  add column main_rest_seconds integer not null default 180 check (main_rest_seconds > 0),
  add column accessory_rest_seconds integer not null default 90 check (accessory_rest_seconds > 0);
