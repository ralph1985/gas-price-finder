/**
 * @typedef {Object} FuelPriceBoundingBox
 * @property {number} x0
 * @property {number} y0
 * @property {number} x1
 * @property {number} y1
 * @property {boolean} initialized
 * @property {number} latitudeSeparation
 */

/**
 * @typedef {Object} FuelPriceStationInfo
 * @property {number|null} id
 * @property {string|null} rotulo
 * @property {string|null} operador
 * @property {string|null} direccion
 * @property {string|null} margen
 * @property {string|null} codPostal
 * @property {string|null} provincia
 * @property {string|null} municipio
 * @property {string|null} localidad
 * @property {string|null} fechaPvp
 * @property {string|null} horaPvp
 * @property {string|null} tipoVenta
 * @property {string|null} remision
 * @property {string|null} coordenadaX
 * @property {string|null} coordenadaY
 * @property {number|null} coordenadaX_dec
 * @property {number|null} coordenadaY_dec
 * @property {string|null} horario
 * @property {string|null} tipoServicio
 * @property {string|null} nombreCCAA
 * @property {string|null} tipoRango
 * @property {string|null} tipoEstacion
 * @property {number|null} porcBioetanol
 * @property {number|null} porcBioalcohol
 * @property {string|null} servicios
 * @property {string|null} imagenEESS
 * @property {string|null} planesDescuento
 * @property {boolean} favorita
 * @property {number|null} valoracion
 * @property {number|null} precio
 */

/**
 * @typedef {Object} FuelPriceProductInfo
 * @property {number|null} id
 * @property {string|null} nombre
 * @property {string|null} descripcion
 * @property {boolean|null} activo
 * @property {boolean|null} terrestre
 * @property {boolean|null} embarcacion
 * @property {boolean|null} bioetanol
 * @property {boolean|null} biodiesel
 * @property {number|null} orden
 */

/**
 * @typedef {Object} FuelPriceStation
 * @property {number|null} id
 * @property {number|null} precio
 * @property {string|null=} fuelId
 * @property {FuelPriceStationInfo} estacion
 * @property {FuelPriceProductInfo} producto
 * @property {string|null} rango
 * @property {boolean} favorita
 */

/**
 * @typedef {Object} FuelPriceSearchResult
 * @property {FuelPriceBoundingBox} bbox
 * @property {FuelPriceStation[]} estaciones
 */

/**
 * @typedef {Object} FuelPriceSearchCriteria
 * @property {string=} stationType
 * @property {string=} provinceId
 * @property {string=} municipalityId
 * @property {string=} productId
 * @property {string=} brand
 * @property {boolean=} economicalStations
 * @property {boolean=} discountPlans
 * @property {string=} startTime
 * @property {string=} endTime
 * @property {string=} street
 * @property {string=} streetNumber
 * @property {string=} postalCode
 * @property {string=} saleType
 * @property {string|null=} serviceType
 * @property {string=} operatorId
 * @property {string=} planName
 * @property {string|null=} recipientTypeId
 * @property {{ x0?: string, y0?: string, x1?: string, y1?: string }=} bounds
 */

export {};
