defmodule Veraltheim.CounterApiTest do
  use ExUnit.Case, async: true
  alias Veraltheim.Counter
  test "use Counter through the API" do
    pid = Counter.start(0)
    assert Counter.state(pid) == 0
    Counter.tick(pid)
    Counter.tick(pid)
    assert Counter.state(pid) == 2
  end
end
