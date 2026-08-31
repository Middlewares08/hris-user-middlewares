// Thin wrapper around `addresspinas` (PSGC region/province/city/barangay data)
// used by the profile Home Address picker. Same package the admin Add-Employee
// wizard uses. addresspinas ships CJS with two exports: `philData` and `address`.
import * as addresspinas from 'addresspinas';

const { address } = addresspinas;

// Region / province / city names come back UPPERCASE, barangay names mixed-case.
// A stored profile value may be either the PSGC code (admin Add-Employee saves
// codes) or a free-typed name ("Ilocos Norte") — so match on code first, then
// fall back to a trim + case-insensitive name compare.
const eqName = (a, b) =>
    String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export const getRegions = () => addresspinas?.philData?.allRegions?.regions || [];

export const getProvinces = (regCode) =>
    (regCode ? address.getProvinceOfRegion(regCode)?.provinces : []) || [];

export const getCities = (provCode) =>
    (provCode ? address.getCityMunOfProvince(provCode)?.cityAndMun : []) || [];

export const getBarangays = (munCode) =>
    (munCode ? address.getBarangaysOfCityMun(munCode)?.barangays : []) || [];

// getZipcode returns an array (a city/barangay can map to several).
//  - preferFirst=false: only return a zip when it is unambiguous (city step)
//  - preferFirst=true : return the first match (barangay step, disambiguated)
export const resolveZip = ({ name, munCode, preferFirst = false }) => {
    if (!munCode) return '';
    const result = address.getZipcode({ name, mun_code: munCode });
    if (!Array.isArray(result) || result.length === 0) return '';
    if (preferFirst) return result[0];
    return result.length === 1 ? result[0] : '';
};

const matchRegion = (value) => {
    const regions = getRegions();
    return regions.find((r) => r.reg_code === value) || regions.find((r) => eqName(r.name, value)) || null;
};
const matchProvince = (regCode, value) => {
    const provinces = getProvinces(regCode);
    return provinces.find((p) => p.prov_code === value) || provinces.find((p) => eqName(p.name, value)) || null;
};
const matchCity = (provCode, value) => {
    const cities = getCities(provCode);
    return cities.find((c) => c.mun_code === value) || cities.find((c) => eqName(c.name, value)) || null;
};

// Given whatever is stored on a profile address (codes or names), recover the
// PSGC codes + canonical names needed to drive the cascading dropdowns. Any
// level that can't be matched (and everything below it) comes back empty.
export const resolveAddress = ({ region, province, city } = {}) => {
    const regionOpt = matchRegion(region);
    const provinceOpt = regionOpt ? matchProvince(regionOpt.reg_code, province) : null;
    const cityOpt = provinceOpt ? matchCity(provinceOpt.prov_code, city) : null;
    return {
        regCode: regionOpt?.reg_code || '',
        provCode: provinceOpt?.prov_code || '',
        munCode: cityOpt?.mun_code || '',
        regionName: regionOpt?.name || '',
        provinceName: provinceOpt?.name || '',
        cityName: cityOpt?.name || '',
    };
};
