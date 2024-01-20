defmodule Veraltheim.Repo do
  use Ecto.Repo,
    otp_app: :veraltheim,
    adapter: Ecto.Adapters.Postgres
end
