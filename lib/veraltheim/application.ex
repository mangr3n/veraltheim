defmodule Veraltheim.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [{NodeJS.Supervisor, [path: LiveSvelte.SSR.NodeJS.server_path(), pool_size: 4]},
      # Start the Telemetry supervisor
      VeraltheimWeb.Telemetry,
      # Start the Ecto repository
      Veraltheim.Repo,
      # Start the PubSub system
      {Phoenix.PubSub, name: Veraltheim.PubSub},
      # Start Finch
      {Finch, name: Veraltheim.Finch},
      # Start the Endpoint (http/https)
      VeraltheimWeb.Endpoint
      # Start a worker by calling: Veraltheim.Worker.start_link(arg)
      # {Veraltheim.Worker, arg}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Veraltheim.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    VeraltheimWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
