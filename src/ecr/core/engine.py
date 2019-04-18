import re
from typing import Dict, Any, List, Tuple
import sympy
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
import networkx as nx

from .models import Variable, EquationDef, Check, Assumption
from .units import ureg, Q_
import pint

class EngineError(Exception):
    pass

class CircularDependencyError(EngineError):
    pass

class DimensionalError(EngineError):
    pass

class Engine:
    def __init__(self):
        self.variables: Dict[str, Variable] = {}
        self.equations: Dict[str, EquationDef] = {}
        self.checks: Dict[str, Check] = {}
        self.assumptions: Dict[str, Assumption] = {}
        
        # Sympy symbols
        self._symbols = {}
        
    def add_variable(self, var: Variable):
        self.variables[var.id] = var
        self._symbols[var.simbolo] = sympy.Symbol(var.simbolo)
        
    def add_equation(self, eq: EquationDef):
        self.equations[eq.id] = eq
        
    def add_check(self, check: Check):
        self.checks[check.id] = check
        
    def add_assumption(self, assumption: Assumption):
        self.assumptions[assumption.id] = assumption

    def parse_equation(self, expr_str: str) -> Tuple[str, sympy.Expr]:
        """Parses 'LHS = RHS' into (LHS_symbol_name, RHS_sympy_expr)"""
        if "=" not in expr_str:
            raise EngineError(f"Equation must contain '=': {expr_str}")
        lhs_str, rhs_str = expr_str.split("=", 1)
        lhs_str = lhs_str.strip()
        rhs_str = rhs_str.strip()
        
        transformations = (standard_transformations + (implicit_multiplication_application,))
        
        local_dict = {var.simbolo: sympy.Symbol(var.simbolo) for var in self.variables.values()}
        rhs_expr = parse_expr(rhs_str, transformations=transformations, local_dict=local_dict)
        return lhs_str, rhs_expr

    def build_graph(self) -> nx.DiGraph:
        G = nx.DiGraph()
        
        # Add all variables as nodes
        for var_id, var in self.variables.items():
            G.add_node(var.simbolo, type="variable", id=var_id)
            
        # Parse equations and add dependencies
        for eq_id, eq in self.equations.items():
            lhs_sym, rhs_expr = self.parse_equation(eq.expresion)
            
            if lhs_sym not in [v.simbolo for v in self.variables.values()]:
                raise EngineError(f"Equation '{eq.id}' defines undefined variable '{lhs_sym}'. Please declare it.")
                
            G.add_node(eq.id, type="equation")
            
            # Equation depends on free symbols in RHS
            for sym in rhs_expr.free_symbols:
                G.add_edge(sym.name, eq.id) # Variable -> Equation
                
            # LHS depends on Equation
            G.add_edge(eq.id, lhs_sym)      # Equation -> Variable
            
        return G

    def get_evaluation_order(self) -> List[str]:
        G = self.build_graph()
        try:
            order = list(nx.topological_sort(G))
            # Return only equation IDs in order
            return [node for node in order if G.nodes[node].get("type") == "equation"]
        except nx.NetworkXUnfeasible:
            # Find cycle
            cycle = nx.find_cycle(G)
            cycle_path = " -> ".join([u for u, v in cycle] + [cycle[0][0]])
            raise CircularDependencyError(f"Dependencia circular detectada:\n{cycle_path}\nEl cálculo no puede evaluarse.")

    def evaluate(self):
        # 1. topological sort
        order = self.get_evaluation_order()
        
        # 2. Evaluate
        for eq_id in order:
            self._evaluate_equation(eq_id)
            
        # 3. Evaluate checks
        self._evaluate_checks()

    def _evaluate_equation(self, eq_id: str):
        eq = self.equations[eq_id]
        lhs_sym, rhs_expr = self.parse_equation(eq.expresion)
        
        # Find the target variable
        target_var = next((v for v in self.variables.values() if v.simbolo == lhs_sym), None)
        
        # Substitute values
        subs = {}
        for sym in rhs_expr.free_symbols:
            var = next((v for v in self.variables.values() if v.simbolo == sym.name), None)
            if var is None:
                # Could be a constant like pi, let sympy handle it, or throw error
                pass
            else:
                # Get pint quantity
                if var._calculated_value is not None:
                    val = var._calculated_value
                elif var.valor is not None:
                    val = Q_(var.valor, var.unidad)
                else:
                    raise EngineError(f"Variable '{var.simbolo}' requires a value before evaluating '{eq.id}'")
                
                subs[sym] = val
                
        # Evaluate with pint. Sympy doesn't always play nice with Pint if we just `evalf`.
        # Alternatively, we can evaluate the sympy expression using lambdify or evalf, but
        # since we want to support pint units, it's better to build a python expression or use 
        # a safe evaluator.
        
        # Simple substitution using eval on the string, but replacing symbols with pint quantities.
        # This is tricky because sympy's string representation might differ.
        # Let's use lambdify:
        import math
        modules = [{'pi': math.pi}, 'math'] # To support basic math
        f = sympy.lambdify(list(subs.keys()), rhs_expr, modules=modules)
        
        try:
            result = f(*list(subs.values()))
        except pint.DimensionalityError as e:
            raise DimensionalError(f"Error dimensional en '{eq.id}': {e}")
            
        # Assign back to target variable
        target_var._calculated_value = result
        target_var._computed_from = eq.id
        target_var._is_stale = False
        
        # If target has a declared unit, convert to it to check consistency
        if target_var.unidad:
            try:
                target_var._calculated_value = target_var._calculated_value.to(target_var.unidad)
            except pint.DimensionalityError as e:
                raise DimensionalError(f"No se puede asignar el resultado de '{eq.id}' a '{target_var.simbolo}'.\n"
                                       f"La expresión produce: {target_var._calculated_value.units}\n"
                                       f"pero la variable fue declarada como: {target_var.unidad}\n"
                                       f"Detalle: {e}")

    def _evaluate_checks(self):
        import operator
        ops = {
            '<=': operator.le,
            '>=': operator.ge,
            '<': operator.lt,
            '>': operator.gt,
            '==': operator.eq,
            '!=': operator.ne
        }
        
        for chk_id, chk in self.checks.items():
            expr = chk.expresion
            # Find the operator
            found_op_str = None
            for op_str in ops.keys():
                if op_str in expr:
                    found_op_str = op_str
                    break
                    
            if not found_op_str:
                raise EngineError(f"Operador no encontrado en el check '{chk.id}': {expr}")
                
            lhs_str, rhs_str = expr.split(found_op_str, 1)
            
            def eval_side(side_str):
                side_str = side_str.strip()
                # If it's a variable symbol
                for var in self.variables.values():
                    if side_str == var.simbolo:
                        if var._calculated_value is not None:
                            return var._calculated_value
                        elif var.valor is not None:
                            return Q_(var.valor, var.unidad)
                # Otherwise, let pint parse it
                try:
                    return ureg(side_str)
                except pint.UndefinedUnitError:
                    raise EngineError(f"No se pudo interpretar '{side_str}' en el check '{chk.id}'")
            
            lhs_val = eval_side(lhs_str)
            rhs_val = eval_side(rhs_str)
            
            # Compare using pint
            chk._passed = ops[found_op_str](lhs_val, rhs_val)

