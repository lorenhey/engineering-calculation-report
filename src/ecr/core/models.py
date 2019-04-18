from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field

class Reference(BaseModel):
    tipo: str = "documento" # e.g. libro, norma, plano
    descripcion: str
    revision: Optional[str] = None
    pagina: Optional[str] = None
    url: Optional[str] = None

class VariableSource(BaseModel):
    tipo: str # e.g. dato_proyecto, fabricante, supuesto
    descripcion: Optional[str] = None
    documento: Optional[str] = None
    revision: Optional[str] = None

class Uncertainty(BaseModel):
    tipo: str # normal, uniforme, etc.
    valor: float
    unidad: Optional[str] = None

class Variable(BaseModel):
    id: str
    simbolo: str
    descripcion: str = ""
    valor: Optional[float] = None # Si es entrada, tiene valor
    unidad: Optional[str] = None
    fuente: Optional[Union[VariableSource, str, dict]] = None
    incertidumbre: Optional[Uncertainty] = None
    
    # Atributos internos del motor
    _calculated_value: Optional[Any] = None
    _is_stale: bool = True
    _computed_from: Optional[str] = None # ID de la ecuacion que la calculo

    @property
    def has_value(self):
        return self.valor is not None or self._calculated_value is not None

class EquationDef(BaseModel):
    id: str
    nombre: str = ""
    expresion: str # e.g. "Re = rho * v * D / mu"
    referencia: Optional[Union[Reference, str, dict]] = None
    supuestos: List[str] = []
    notas: str = ""

class Check(BaseModel):
    id: str
    descripcion: str = ""
    expresion: str # e.g. "v <= 3 m/s"
    severidad: str = "error" # warning, error
    
    _passed: Optional[bool] = None
    
class Assumption(BaseModel):
    id: str
    descripcion: str
    justificacion: Optional[str] = None
