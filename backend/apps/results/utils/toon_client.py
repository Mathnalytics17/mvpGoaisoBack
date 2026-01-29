from toon_format import encode, decode

# Simple object
encode({"name": "Alice", "age": 30})
# name: Alice
# age: 30

# Tabular array (uniform objects)
encode([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}])
# [2,]{id,name}:
#   1,Alice
#   2,Bob

# Decode back to Python
decode("items[2]: apple,banana")
# {'items': ['apple', 'banana']}
print(encode([{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]))  # {'items': ['apple', 'banana']}


def to_toon(data: dict | list) -> str:
    """
    Convierte JSON (dict/list) a TOON string
    """
    return encode(data)

def from_toon(text: str):
    """
    Convierte TOON string a Python object (dict/list)
    """
    return decode(text)
