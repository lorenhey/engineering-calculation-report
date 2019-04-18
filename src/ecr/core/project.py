from typing import Dict, Any, Union
import yaml
from pathlib import Path

from .models import Variable, EquationDef, Check, Assumption
from .engine import Engine

class Project:
    def __init__(self, name: str):
        self.name = name
        self.engine = Engine()
        
    def add_variable(self, **kwargs) -> Variable:
        v = Variable(**kwargs)
        self.engine.add_variable(v)
        return v
        
    def add_equation(self, **kwargs) -> EquationDef:
        e = EquationDef(**kwargs)
        self.engine.add_equation(e)
        return e
        
    def add_check(self, **kwargs) -> Check:
        c = Check(**kwargs)
        self.engine.add_check(c)
        return c
        
    def add_assumption(self, **kwargs) -> Assumption:
        a = Assumption(**kwargs)
        self.engine.add_assumption(a)
        return a
        
    def calculate(self):
        self.engine.evaluate()
        
    @classmethod
    def from_yaml(cls, filepath: Union[str, Path]) -> "Project":
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            
        proj = cls(name=data.get('proyecto', 'Untitled'))
        
        for v_id, v_data in data.get('variables', {}).items():
            v_data['id'] = v_id
            if 'simbolo' not in v_data:
                v_data['simbolo'] = v_id
            proj.add_variable(**v_data)
            
        for eq_id, eq_data in data.get('ecuaciones', {}).items():
            eq_data['id'] = eq_id
            proj.add_equation(**eq_data)
            
        for chk_id, chk_data in data.get('verificaciones', {}).items():
            chk_data['id'] = chk_id
            proj.add_check(**chk_data)
            
        for as_id, as_data in data.get('supuestos', {}).items():
            as_data['id'] = as_id
            proj.add_assumption(**as_data)
            
        return proj
