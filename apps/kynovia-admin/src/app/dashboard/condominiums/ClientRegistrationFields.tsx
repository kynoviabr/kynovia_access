"use client";

import { useEffect, useState } from "react";
import { brazilStates, brazilTimezones, timezoneByState } from "./form-options";

type ClientRegistrationFieldsProps = {
  addressCity?: string;
  addressComplement?: string;
  addressLine?: string;
  addressNumber?: string;
  addressPostalCode?: string;
  addressState?: string;
  clientCnpj?: string;
  clientEmail?: string;
  clientPhone?: string;
  timezone?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function isValidCnpj(value: string) {
  const digits = onlyDigits(value);

  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return digits.replace(/^(\d{2})(\d+)/, "($1) $2");
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

function formatCep(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
}

export function RequiredLabel({ children }: { children: string }) {
  return (
    <span>
      <span aria-hidden="true">*</span> {children}
    </span>
  );
}

export function ClientRegistrationFields({
  addressCity = "",
  addressComplement = "",
  addressLine = "",
  addressNumber = "",
  addressPostalCode = "",
  addressState = "",
  clientCnpj = "",
  clientEmail = "",
  clientPhone = "",
  timezone = "America/Sao_Paulo"
}: ClientRegistrationFieldsProps) {
  const [uf, setUf] = useState(addressState);
  const [timezoneValue, setTimezoneValue] = useState(timezone);
  const [cnpj, setCnpj] = useState(formatCnpj(clientCnpj));
  const [cnpjError, setCnpjError] = useState("");
  const [phone, setPhone] = useState(formatPhone(clientPhone));
  const [cep, setCep] = useState(formatCep(addressPostalCode));
  const [address, setAddress] = useState(addressLine);
  const [city, setCity] = useState(addressCity);

  useEffect(() => {
    if (uf && uf in timezoneByState) {
      setTimezoneValue(timezoneByState[uf as keyof typeof timezoneByState]);
    }
  }, [uf]);

  useEffect(() => {
    const digits = onlyDigits(cep);

    if (digits.length !== 8) {
      return;
    }

    const controller = new AbortController();

    async function fillAddressFromCep() {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
          signal: controller.signal
        });
        const data = (await response.json()) as {
          erro?: boolean;
          localidade?: string;
          logradouro?: string;
          uf?: string;
        };

        if (data.erro) {
          return;
        }

        if (data.logradouro) {
          setAddress(data.logradouro);
        }

        if (data.localidade) {
          setCity(data.localidade);
        }

        if (data.uf && brazilStates.includes(data.uf as (typeof brazilStates)[number])) {
          setUf(data.uf);
        }

        window.setTimeout(() => {
          document.querySelector<HTMLInputElement>('input[name="address_number"]')?.focus();
        }, 0);
      } catch {
        // CEP lookup is a convenience; manual entry remains available.
      }
    }

    void fillAddressFromCep();

    return () => controller.abort();
  }, [cep]);

  return (
    <>
      <label>
        <RequiredLabel>Timezone</RequiredLabel>
        <select name="timezone" required value={timezoneValue} onChange={(event) => setTimezoneValue(event.target.value)}>
          {brazilTimezones.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <div className="form-row email-phone-row">
        <label>
          <RequiredLabel>E-mail comercial</RequiredLabel>
          <input name="client_email" type="email" required defaultValue={clientEmail} />
        </label>
        <label>
          <RequiredLabel>Telefone</RequiredLabel>
          <input
            name="client_phone"
            required
            inputMode="tel"
            pattern="\(\d{2}\) \d{5}-\d{4}"
            placeholder="(XX) XXXXX-XXXX"
            title="Use o formato (XX) XXXXX-XXXX"
            value={phone}
            onChange={(event) => setPhone(formatPhone(event.target.value))}
          />
        </label>
      </div>
      <div className="form-row cnpj-cep-row">
        <label>
          <RequiredLabel>CNPJ</RequiredLabel>
          <input
            name="client_cnpj"
            required
            inputMode="numeric"
            pattern="\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}"
            placeholder="00.000.000/0000-00"
            title="Use o formato 00.000.000/0000-00"
            value={cnpj}
            onBlur={(event) => {
              const isComplete = onlyDigits(event.target.value).length === 14;
              const isValid = !isComplete || isValidCnpj(event.target.value);
              event.target.setCustomValidity(isValid ? "" : "Informe um CNPJ valido.");
              setCnpjError(isValid ? "" : "CNPJ invalido.");
            }}
            onChange={(event) => {
              const formatted = formatCnpj(event.target.value);
              setCnpj(formatted);
              event.target.setCustomValidity("");
              setCnpjError("");
            }}
          />
          {cnpjError ? <small className="field-error">{cnpjError}</small> : null}
        </label>
        <label>
          <RequiredLabel>CEP</RequiredLabel>
          <input
            name="address_postal_code"
            required
            inputMode="numeric"
            pattern="\d{5}-\d{3}"
            placeholder="XXXXX-XXX"
            title="Use o formato XXXXX-XXX"
            value={cep}
            onChange={(event) => setCep(formatCep(event.target.value))}
          />
        </label>
      </div>
      <label>
        <RequiredLabel>Endereco</RequiredLabel>
        <input
          name="address_line"
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </label>
      <div className="form-row address-number-row">
        <label>
          <RequiredLabel>Numero</RequiredLabel>
          <input name="address_number" required defaultValue={addressNumber} />
        </label>
        <label>
          Complemento
          <input name="address_complement" defaultValue={addressComplement} />
        </label>
      </div>
      <div className="form-row compact-address-row">
        <label>
          <RequiredLabel>Cidade</RequiredLabel>
          <input
            name="address_city"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </label>
        <label>
          <RequiredLabel>UF</RequiredLabel>
          <select name="address_state" required value={uf} onChange={(event) => setUf(event.target.value)}>
            <option value="">UF</option>
            {brazilStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
