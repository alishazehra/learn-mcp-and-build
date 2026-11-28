# Tool design comparison: `get_note` and `do_thing`

The live `get_note` tool says exactly what it does, requires an `id` that must be a UUID, and tells the model to use `list_notes` when it needs to find that ID. Its result also has a defined shape. These details help the model recognize a note-reading request and provide a valid argument.

The deliberately poor `do_thing` example in `src/examples/bad-note-tool.ts` has no description, a vague name, and only an optional, unrestricted `value` string. The model cannot tell whether it reads, creates, or deletes a note, when to choose it, or what value to pass. It may therefore be selected for unrelated requests or called with missing or unusable input.

The poor example is intentionally not registered by the Worker. It exists only to compare tool design.
