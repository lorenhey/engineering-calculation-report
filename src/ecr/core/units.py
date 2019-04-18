import pint

# Create a default shared registry for the framework.
# Engineering calculation often uses a mix of SI, Imperial, and specific units.
ureg = pint.UnitRegistry()
# ureg.setup_matplotlib() # disabled until matplotlib is installed

# Configure some specific aliases or behavior if needed
# E.g. we want 'kg' instead of 'kilogram' as default representation
# ureg.default_format = "~P" # Short, pretty format (e.g. kg instead of kilogram)

def Q_(value, unit):
    if unit is None or unit == "" or unit == "dimensionless":
        return value
    return ureg.Quantity(value, unit)

def check_dimensionless(q):
    if isinstance(q, pint.Quantity):
        return q.dimensionless
    return True
