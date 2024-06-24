defmodule Veraltheim.Counter.Server do
  import Veraltheim.Counter.Core
  def run(count) do
    new_count = listen(count)
    run(new_count)
  end

  def listen(count) do
    receive do
      {:tick, _pid} ->
        inc(count)
      {:state, pid} ->
        send pid, {:count, count}
        count
    end
  end
end
