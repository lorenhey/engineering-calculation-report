import pytest
from ecr.core.project import Project
from ecr.core.models import Variable, EquationDef
from ecr.core.engine import CircularDependencyError, DimensionalError

def test_simple_calculation():
    proj = Project("Test")
    proj.add_variable(id="D", simbolo="D", valor=52.5, unidad="mm")
    proj.add_variable(id="Q", simbolo="Q", valor=25, unidad="m^3/h")
    proj.add_variable(id="A", simbolo="A", unidad="m^2")
    proj.add_variable(id="v", simbolo="v", unidad="m/s")
    
    proj.add_equation(id="area", expresion="A = 3.14159265 * D**2 / 4")
    proj.add_equation(id="vel", expresion="v = Q / A")
    
    proj.calculate()
    
    A_val = proj.engine.variables["A"]._calculated_value
    assert A_val.to("m^2").magnitude == pytest.approx(0.00216475, rel=1e-4)
    
    v_val = proj.engine.variables["v"]._calculated_value
    assert v_val.to("m/s").magnitude == pytest.approx(3.208, rel=1e-3)

def test_circular_dependency():
    proj = Project("Test")
    proj.add_variable(id="x", simbolo="x")
    proj.add_variable(id="y", simbolo="y")
    proj.add_equation(id="eq1", expresion="x = y + 1")
    proj.add_equation(id="eq2", expresion="y = x * 2")
    
    with pytest.raises(CircularDependencyError):
        proj.calculate()

def test_dimensional_error():
    proj = Project("Test")
    proj.add_variable(id="dist", simbolo="dist", valor=10, unidad="m")
    proj.add_variable(id="time", simbolo="time", valor=5, unidad="s")
    proj.add_variable(id="force", simbolo="force", unidad="N") # Force != m/s
    
    proj.add_equation(id="eq1", expresion="force = dist / time")
    
    with pytest.raises(DimensionalError):
        proj.calculate()
